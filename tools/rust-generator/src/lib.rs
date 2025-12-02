use std::collections::{HashMap, HashSet};
use std::error::Error;
use std::ffi::OsString;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use schemars::schema::RootSchema;
use serde_json::{json, Value};

pub struct CrateStructure {
    pub crate_path: OsString,
    pub src_path: OsString,
}

pub fn generate_crate_structure(
    path: &OsString,
    package_name: &String,
    package_version: &String
) -> Result<CrateStructure, Box<dyn Error>> {
    // ./rust/
    let mut crate_path_buf = PathBuf::from(path);
    crate_path_buf.push("rust");
    let crate_path = crate_path_buf.as_path();
    std::fs::create_dir_all(crate_path)?;

    // ./rust/Cargo.toml
    let mut cargo_toml_path_buf = crate_path_buf.clone();
    cargo_toml_path_buf.push("Cargo.toml");
    let cargo_toml_path = cargo_toml_path_buf.as_path();
    let mut cargo_toml_file = File::create(cargo_toml_path)?;
    let cargo_toml_content = format!(r#"[package]
name = "{package_name}"
version = "{package_version}"
edition = "2024"

[dependencies]
serde = {{ version = "1.0", features = ["derive"] }}
serde_json = "1.0.145"
"#);
    cargo_toml_file.write_all(cargo_toml_content.as_bytes())?;

    // ./rust/src
    let mut src_path_buf = crate_path_buf.clone();
    src_path_buf.push("src");
    let src_path = src_path_buf.as_path();
    let _ = std::fs::create_dir_all(src_path)?;

    Ok(CrateStructure {
        crate_path: crate_path.as_os_str().to_os_string(),
        src_path: src_path.as_os_str().to_os_string(),
    })
}

pub fn get_bundled_schema(
    schemas_path: &OsString,
    skip_paths: &HashSet<OsString>
) -> Result<Value, Box<dyn Error>> {
    let schemas_entries = std::fs::read_dir(&schemas_path)?;

    let file_names = schemas_entries
        .map(|entry| entry.unwrap().file_name())
        .filter(|file_name| {
            let file_name_str = file_name.to_str().unwrap();
            file_name_str.ends_with(".schema.json") && !skip_paths.contains(file_name)
        }).collect::<Vec<OsString>>();

    let mut docs: HashMap<String, Value> = HashMap::new();
    for file_name in file_names {
        let key = file_name.to_str().unwrap().trim_end_matches(".schema.json").to_string();
        let path = PathBuf::from(&schemas_path).join(file_name);
        let file = File::open(&path).unwrap();
        let schema_value: Value = serde_json::from_reader(file).unwrap();
        docs.insert(key, schema_value);
    }

    // Build definitions with rewritten documents and hoisted local definitions
    let mut defs = serde_json::Map::new();
    for (key, doc) in &docs {
        let mut hoisted_defs = serde_json::Map::new();
        let transformed = transform(doc, key, &mut hoisted_defs);
        defs.insert(key.clone(), transformed);
        for (k, v) in hoisted_defs.into_iter() {
            defs.insert(k, v);
        }
    }

    let bundled: Value = json!({
        "$schema": "http://json-schema.org/draft-07/schema",
        "definitions": defs,
    });

    Ok(bundled)
}

pub fn generate_rs_structures(
    schema: Value,
    output_path: &OsString,
) -> Result<(), Box<dyn Error>> {
    let root_schema: RootSchema = serde_json::from_value(schema)?;
    let mut type_space_settings = typify::TypeSpaceSettings::default();
    type_space_settings.with_unknown_crates(typify::UnknownPolicy::Allow);
    type_space_settings.with_struct_builder(false);

    let mut typespace = typify::TypeSpace::new(&type_space_settings);
    typespace.add_root_schema(root_schema)?;

    let type_space_file = syn::parse2::<syn::File>(typespace.to_stream())?;
    let code = prettyplease::unparse(&type_space_file);

    let lib_rs_path = PathBuf::from(output_path).join("lib.rs");
    let mut lib_rs_file = File::create(lib_rs_path)?;
    lib_rs_file.write_all(code.as_bytes())?;

    Ok(())
}

// Transform a schema document by hoisting any local definitions to the top-level
// and rewriting refs to point at the hoisted entries.
fn transform(
    value: &Value,
    current_doc: &str,
    hoisted: &mut serde_json::Map<String, Value>
) -> Value {
    match value {
        Value::Object(map) => {
            let mut out = serde_json::Map::with_capacity(map.len());
            for (k, v) in map.iter() {
                if k == "$defs" || k == "definitions" {
                    if let Value::Object(defs_map) = v {
                        for (def_name, def_val) in defs_map.iter() {
                            let rewritten_def = transform(def_val, current_doc, hoisted);
                            hoisted.insert(format!("{}.{}", current_doc, def_name), rewritten_def);
                        }
                    }
                    continue; // drop nested defs
                }
                if k == "$ref" {
                    if let Value::String(s) = v {
                        let new_ref = rewrite_ref_target(s, current_doc);
                        out.insert(k.clone(), Value::String(new_ref));
                        continue;
                    }
                }
                out.insert(k.clone(), transform(v, current_doc, hoisted));
            }
            Value::Object(out)
        }
        Value::Array(arr) => {
            Value::Array(arr.iter().map(|v| transform(v, current_doc, hoisted)).collect())
        },
        _ => value.clone(),
    }
}

fn rewrite_ref_target(s: &str, current_doc: &str) -> String {
    if let Some(rest) = s.strip_prefix("./") {
        let (file_part, frag_opt) = match rest.split_once('#') {
            Some((file, frag)) => (file, Some(frag)),
            None => (rest, None),
        };

        let base = file_part.trim_end_matches(".schema.json");
        if let Some(frag) = frag_opt {
            let frag = frag.trim_start_matches('/');
            if let Some(name) = frag.strip_prefix("$defs/").or_else(|| frag.strip_prefix("definitions/")) {
                return format!("#/definitions/{}.{}", base, name);
            }
        }
        return format!("#/definitions/{}", base);
    }
    if let Some(frag) = s.strip_prefix('#') {
        let frag = frag.trim_start_matches('/');
        if let Some(name) = frag.strip_prefix("$defs/").or_else(|| frag.strip_prefix("definitions/")) {
            return format!("#/definitions/{}.{}", current_doc, name);
        }
        return s.to_string();
    }
    s.to_string()
}
