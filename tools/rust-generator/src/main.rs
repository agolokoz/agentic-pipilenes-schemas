use clap::Parser;
use rust_generator::{generate_crate_structure, generate_rs_structures, get_bundled_schema};
use std::collections::HashSet;
use std::env;
use std::ffi::OsString;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;

/// Rust crate generator
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Input directory containing schema files
    #[arg(short, long)]
    input: OsString,

    /// Output directory for generated Rust crate
    #[arg(short, long)]
    output: OsString,

    /// Name of the generated Rust crate
    #[arg(long)]
    package_name: String,

    /// Version of the generated Rust crate
    #[arg(long)]
    package_version: String,

    /// Enable verbose output
    #[arg(short, long, default_value_t = false)]
    verbose: bool
}

// cargo run -- \
//  -i ../../schemas \
//  -o ../../packages \
//  --package-name agentic-pipeline-schemas \
//  --package-version "0.0.1" \
//  -v
fn main() {
    let args = Args::parse();
    if args.verbose {
        println!("{:?}", args);
    }

    if args.verbose {
        println!("Generating Rust crate...");
    }

    let curr_path = env::current_dir().unwrap_or_else(|err| panic!("Failed to get current dir: {err}"));
    let crate_structure = generate_crate_structure(
        &curr_path.join("src").into_os_string(),
        &args.output,
        &args.package_name,
        &args.package_version
    ).unwrap_or_else(|err| panic!("Failed to generate crate structure: {err}"));

    if args.verbose {
        println!("Generating bundled schema...");
    }
    let bundled_file_name = "bundled.schema.json";
    let skip_file_names = HashSet::from([OsString::from(bundled_file_name)]);
    let bundled_schema = get_bundled_schema(&args.input, &skip_file_names)
        .unwrap_or_else(|err| panic!("Failed to get bundled schema: {err}"));

    // for debugging purposes: save bundled schema to [bundled_file_name]
    let bundled_schema_filepath = PathBuf::from(&args.input).join(bundled_file_name);
    let mut file = File::create(&bundled_schema_filepath)
        .unwrap_or_else(|err| {
            let filepath = bundled_schema_filepath.to_str().unwrap();
            panic!("Failed to create bundled schema file {filepath}: {err}")
        });
    let serialized = serde_json::to_string_pretty(&bundled_schema)
        .unwrap_or_else(|err| panic!("Failed to serialize bundled schema: {err}"));
    file.write_all(serialized.as_bytes())
        .unwrap_or_else(|err| panic!("Failed to write bundled schema to file: {err}"));

    if args.verbose {
        println!("Generating rust structures...");
    }
    generate_rs_structures(bundled_schema, &crate_structure.src_path)
        .unwrap_or_else(|err| panic!("Failed to generate Rust structures: {}", err));

    if args.verbose {
        println!("Done!");
    }
}