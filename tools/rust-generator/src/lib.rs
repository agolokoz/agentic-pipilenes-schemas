use schemars::schema::RootSchema;
use serde_json::{json, Value};
use std::collections::{BTreeMap, HashSet};
use std::error::Error;
use std::ffi::{OsStr, OsString};
use std::fs::File;
use std::io::{Read, Write};
use std::path::PathBuf;

pub struct CrateStructure {
    pub crate_path: OsString,
    pub src_path: OsString,
}

/// Generates crate files structure:
/// ./rust/
///     Cargo.toml
///     README.md
///     src/
///         lib.rs
pub fn generate_crate_structure(
    generator_src_path: &OsString,
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
name = "{package_name}-dev"
version = "{package_version}"
edition = "2024"
description = "Rust types and parser generated from JSON schemas"
homepage = "https://github.com/agolokoz/agentic-pipilenes-schemas"
repository = "https://github.com/agolokoz/agentic-pipilenes-schemas"
license = "MIT"
readme = "README.md"

[dependencies]
serde = {{ version = "1.0.228", features = ["derive"] }}
serde_json = "1.0.145"
"#);
    cargo_toml_file.write_all(cargo_toml_content.as_bytes())?;

    // ./rust/README.md
    let mut readme_path_buf = crate_path_buf.clone();
    readme_path_buf.push("README.md");
    let readme_path = readme_path_buf.as_path();
    let mut readme_file = File::create(readme_path)?;
    let readme_content = format!(r#"# Rust types and parser generated from JSON schemas."#);
    readme_file.write_all(readme_content.as_bytes())?;

    // ./rust/src
    let mut src_path_buf = crate_path_buf.clone();
    src_path_buf.push("src");
    let src_path = src_path_buf.as_path();
    let _ = std::fs::create_dir_all(src_path)?;

    // ./rust/src/lib.rs
    let mut lib_rs_content = r#"pub mod types;

pub fn parse_json<'a, T>(json: &'a str) -> serde_json::Result<T>
where T: serde::de::Deserialize<'a>
{
    serde_json::from_str(json)
}

"#.to_string();
    let tests_content = get_file_content(PathBuf::from(generator_src_path).join("tests.rs").as_os_str())?;
    lib_rs_content.push_str(&tests_content);
    let lib_rs_path = src_path_buf.clone().join("lib.rs");
    let mut lib_rs_file = File::create(lib_rs_path)?;
    lib_rs_file.write_all(lib_rs_content.as_bytes())?;

    Ok(CrateStructure {
        crate_path: crate_path.as_os_str().to_os_string(),
        src_path: src_path.as_os_str().to_os_string(),
    })
}

/// Accumulates all *.schema.json files from [schemas_path] without [skip_file_names]
/// into one JSON schema
pub fn get_bundled_schema(
    schemas_path: &OsString,
    skip_file_names: &HashSet<OsString>
) -> Result<Value, Box<dyn Error>> {
    let schemas_entries = std::fs::read_dir(&schemas_path)?;

    let mut file_names = schemas_entries
        .map(|entry| entry.unwrap().file_name())
        .filter(|file_name| {
            let file_name_str = file_name.to_str().unwrap();
            file_name_str.ends_with(".schema.json") && !skip_file_names.contains(file_name)
        })
        .collect::<Vec<OsString>>();
    file_names.sort();

    let mut schemas: BTreeMap<String, Value> = BTreeMap::new();
    for file_name in file_names {
        let key = file_name.to_str().unwrap().trim_end_matches(".schema.json").to_string();
        let path = PathBuf::from(&schemas_path).join(file_name);
        let file = File::open(&path).unwrap();
        let schema_value: Value = serde_json::from_reader(file).unwrap();
        schemas.insert(key, schema_value);
    }

    // Build definitions with rewritten documents and hoisted local definitions
    let mut defs = serde_json::Map::new();
    for (key, schema) in &schemas {
        let mut hoisted_defs = serde_json::Map::new();
        let transformed = transform(schema, key, &mut hoisted_defs);
        defs.insert(key.clone(), transformed);

        for (k, v) in hoisted_defs.into_iter() {
            // workaround for "oneOf" arrays in different objects
            if let Some(old_value) = defs.get(&k) &&
                let Value::Object(old_value_map) = old_value &&
                let Value::Object(new_value_map) = &v &&
                let Some(old_value_arr) = old_value_map.get("oneOf") &&
                let Some(new_value_arr) = new_value_map.get("oneOf") &&
                let Value::Array(old_value_vec) = old_value_arr &&
                let Value::Array(new_value_vec) = new_value_arr
            {
                let mut values_set: HashSet<Value> = HashSet::new();
                old_value_vec.iter().for_each(|value| { values_set.insert(value.clone()); () });
                new_value_vec.iter().for_each(|value| { values_set.insert(value.clone()); () });
                let values_vec= values_set.into_iter().collect::<Vec<Value>>();
                let values_arr = Value::Array(values_vec);

                let mut one_of_map = serde_json::Map::new();
                one_of_map.insert(k.clone(), values_arr);
                defs.insert(k, Value::Object(one_of_map));

                continue;
            }

            defs.insert(k, v);
        }
    }

    let bundled: Value = json!({
        "$schema": "http://json-schema.org/draft-07/schema",
        "$defs": defs,
    });

    Ok(bundled)
}

/// Generates Rust types from [schema] and saves them to [output_path]/types.rs
pub fn generate_rs_structures(
    schema: Value,
    output_path: &OsString,
) -> Result<(), Box<dyn Error>> {
    let mut type_space_settings = typify::TypeSpaceSettings::default();
    type_space_settings.with_unknown_crates(typify::UnknownPolicy::Allow);
    type_space_settings.with_struct_builder(false);
    type_space_settings.with_derive("PartialEq".to_string());

    let mut type_space = typify::TypeSpace::new(&type_space_settings);
    let root_schema: RootSchema = serde_json::from_value(schema)?;
    type_space.add_root_schema(root_schema)?;

    let type_space_file = syn::parse2::<syn::File>(type_space.to_stream())?;
    let mut code = prettyplease::unparse(&type_space_file);
    code = cleanup_rs_code(&code);

    let types_rs_path = PathBuf::from(output_path).join("types.rs");
    let mut types_rs_file = File::create(types_rs_path)?;
    types_rs_file.write_all(code.as_bytes())?;

    Ok(())
}

fn cleanup_rs_code(code: &str) -> String {
    let code = cleanup_comment_blocks(code);
    code.replace("::std::convert::From", "From")
        .replace("::std::convert::TryFrom", "TryFrom")
        .replace("::std::option::Option", "Option")
        .replace("::std::result::Result", "Result")
        .replace("::std::string::String", "String")
        .replace("::std::vec::Vec", "Vec")
        .replace(" ::", " ")
}

fn cleanup_comment_blocks(input: &str) -> String {
    let mut result = String::new();
    let mut in_comment_block = false;
    let mut first_comment_block = true;

    for line in input.lines() {
        if line.starts_with("///") {
            if !in_comment_block {
                in_comment_block = true;
                // prevent '\n' at the first file line
                if first_comment_block {
                    first_comment_block = false;
                } else {
                    result.push('\n');
                }
            }
        } else {
            in_comment_block = false;
            result.push_str(line);
            result.push('\n');
        }
    }

    result
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
                if k == "$defs" {
                    if let Value::Object(defs_map) = v {
                        for (def_name, def_val) in defs_map.iter() {
                            let rewritten_def = transform(def_val, current_doc, hoisted);
                            hoisted.insert(def_name.clone(), rewritten_def);
                        }
                    }
                    continue; // drop nested defs
                }

                if k == "$ref" && let Value::String(s) = v {
                    let new_ref = rewrite_ref_target(s);
                    out.insert(k.clone(), Value::String(new_ref));
                    continue;
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

fn rewrite_ref_target(s: &str) -> String {
    if let Some(rest) = s.strip_prefix("./") {
        let (file_part, frag_opt) = match rest.split_once('#') {
            Some((file, frag)) => (file, Some(frag)),
            None => (rest, None),
        };

        let base = file_part.trim_end_matches(".schema.json");
        if let Some(frag) = frag_opt {
            let frag = frag.trim_start_matches('/');
            if let Some(name) = frag.strip_prefix("$defs/") {
                return format!("#/$defs/{name}");
            }
        }

        return format!("#/$defs/{base}");
    }

    if let Some(frag) = s.strip_prefix('#') {
        let frag = frag.trim_start_matches('/');
        if let Some(name) = frag.strip_prefix("$defs/") {
            return format!("#/$defs/{name}");
        }
        return s.to_string();
    }

    s.to_string()
}

fn get_file_content(filepath: &OsStr) -> Result<String, Box<dyn Error>> {
    let mut file = File::open(filepath)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;
    Ok(content)
}