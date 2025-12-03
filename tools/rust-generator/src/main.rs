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
    // let bundled_schema_filepath = PathBuf::from(&args.input).join(bundled_file_name);
    // let mut file = File::create(&bundled_schema_filepath)
    //     .unwrap_or_else(|err| {
    //         let filepath = bundled_schema_filepath.to_str().unwrap();
    //         panic!("Failed to create bundled schema file {filepath}: {err}")
    //     });
    // let serialized = serde_json::to_string_pretty(&bundled_schema)
    //     .unwrap_or_else(|err| panic!("Failed to serialize bundled schema: {err}"));
    // file.write_all(serialized.as_bytes())
    //     .unwrap_or_else(|err| panic!("Failed to write bundled schema to file: {err}"));

    if args.verbose {
        println!("Generating rust structures...");
    }
    generate_rs_structures(bundled_schema, &crate_structure.src_path)
        .unwrap_or_else(|err| panic!("Failed to generate Rust structures: {}", err));

    if args.verbose {
        println!("Done!");
    }
}

// Test graph json:
// {"nodes":[{"id":"start","type":"start","ports":[{"id":"out","direction":"output"}],"config":{"kind":"start","initial_state":{"movies":[],"continue":true,"count":0}}},{"id":"node_while","type":"while","ports":[{"id":"in","direction":"input"},{"id":"exit","direction":"output"}],"config":{"kind":"while","condition":{"expression":"state.continue == true","format":"cel"},"max_iterations":10,"body":{"nodes":[{"id":"b_agent","type":"agent","ports":[{"id":"in","direction":"input"},{"id":"out","direction":"output"}],"config":{"kind":"agent","agent_id":"demo-agent","input_mapping":{"fields":{"input":"{{workflow.input_as_text}}"}},"output_mapping":{"to_state":{"agent_output":"agent_output"}},"model":"gpt-4.1-mini","params":{"temperature":0.3}}},{"id":"b_set_accumulate","type":"set_state","ports":[{"id":"in","direction":"input"},{"id":"out","direction":"output"}],"config":{"kind":"set_state","assignments":[{"name":"count","expression":{"expression":"state.count + 1","format":"cel"}},{"name":"movies","expression":{"expression":"state.movies + [input.output_parsed]","format":"cel"}}]}},{"id":"b_if_else","type":"if_else","ports":[{"id":"in","direction":"input"},{"id":"case-0","direction":"output"},{"id":"fallback","direction":"output"}],"config":{"kind":"if_else","cases":[{"label":"case-0","output_port_id":"case-0","predicate":{"expression":"size(state.movies) == 3","format":"cel"}}],"fallback":{"label":"fallback","output_port_id":"fallback"}}},{"id":"b_set_continue","type":"set_state","ports":[{"id":"in","direction":"input"},{"id":"out","direction":"output"}],"config":{"kind":"set_state","assignments":[{"name":"continue","expression":{"expression":"false","format":"cel"}}]}}],"edges":[{"id":"b_e1","source_node_id":"b_agent","source_port_id":"out","target_node_id":"b_set_accumulate","target_port_id":"in"},{"id":"b_e2","source_node_id":"b_set_accumulate","source_port_id":"out","target_node_id":"b_if_else","target_port_id":"in"},{"id":"b_e3","source_node_id":"b_if_else","source_port_id":"case-0","target_node_id":"b_set_continue","target_port_id":"in"}]}}},{"id":"node_transform_result","type":"transform","ports":[{"id":"in","direction":"input"},{"id":"out","direction":"output"}],"config":{"kind":"transform","mode":"expression","expr":{"expression":"{ 'result': state.movies }","format":"cel"}}},{"id":"node_approval","type":"approval","ports":[{"id":"in","direction":"input"},{"id":"on_approve","direction":"output"},{"id":"on_reject","direction":"output"}],"config":{"kind":"approval","message":"Approve?  {{input.result}}","variable_mapping":[{"name":"input.result","expression":{"expression":"input.result","format":"cel"}}]}},{"id":"node_end_success","type":"end","ports":[{"id":"in","direction":"input"}],"config":{"kind":"end","output_selector":{"mode":"expression","expression":"{'movies': state.movies }"}}}],"edges":[{"id":"e_start_while","source_node_id":"start","source_port_id":"out","target_node_id":"node_while","target_port_id":"in"},{"id":"e_while_exit_transform","source_node_id":"node_while","source_port_id":"exit","target_node_id":"node_transform_result","target_port_id":"in"},{"id":"e_transform_approval","source_node_id":"node_transform_result","source_port_id":"out","target_node_id":"node_approval","target_port_id":"in"},{"id":"e_approval_approve_end","source_node_id":"node_approval","source_port_id":"on_approve","target_node_id":"node_end_success","target_port_id":"in"}]}