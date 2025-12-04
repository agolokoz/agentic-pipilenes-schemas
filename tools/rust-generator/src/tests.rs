#[cfg(test)]
mod tests {
    use crate::types::*;
    use crate::types::OutputSelectorMode::Expression;
    use super::*;

    #[test]
    fn parse_edge() {
        let edge_json = r#"{
            "id": "e_start_while",
            "source_node_id": "start",
            "source_port_id": "out",
            "target_node_id": "node_while",
            "target_port_id": "in"
        }"#;

        let edge = Edge {
            id: "e_start_while".to_string(),
            source_node_id: "start".to_string(),
            source_port_id: "out".to_string(),
            target_node_id: "node_while".to_string(),
            target_port_id: "in".to_string(),
        };

        let edge_from_json = parse_json::<Edge>(edge_json).unwrap();
        assert_eq!(edge_from_json, edge);
    }

    #[test]
    fn parse_start_node() {
        let node_json = r#"{
            "id": "start",
            "type": "start",
            "ports": [
                {
                    "id": "out",
                    "direction": "output"
                }
            ],
            "config": {
                "kind": "start",
                "initial_state": {
                    "movies": [],
                    "continue": true,
                    "count": 0
                }
            }
        }"#;

        let node = Start {
            id: "start".to_string(),
            type_: serde_json::Value::String("start".to_string()),
            ports: vec![
                Port {
                    id: "out".to_string(),
                    direction: PortDirection::Output,
                }
            ],
            config: StartConfig {
                kind: serde_json::Value::String("start".to_string()),
                initial_state: serde_json::from_str::<serde_json::Map<String, serde_json::Value>>(r#"{
                    "movies": [],
                    "continue": true,
                    "count": 0
                }
                "#).unwrap(),
            }
        };

        let node_from_json = parse_json::<Start>(node_json).unwrap();
        assert_eq!(node_from_json, node);
    }

    #[test]
    fn parse_end_node() {
        let node_json = r#"{
            "id": "node_end_success",
            "type": "end",
            "ports": [
                {
                    "id": "in",
                    "direction": "input"
                }
            ],
            "config": {
                "kind": "end",
                "output_selector": {
                    "mode": "expression",
                    "expression": "{'movies': state.movies }"
                }
            }
        }"#;

        let node = End {
            id: "node_end_success".to_string(),
            type_: serde_json::Value::String("end".to_string()),
            ports: vec![
                Port {
                    id: "in".to_string(),
                    direction: PortDirection::Input,
                }
            ],
            config: EndConfig {
                kind: serde_json::Value::String("end".to_string()),
                output_selector: Some(OutputSelector {
                    mode: Expression,
                    expression: Some(OutputSelectorExpression::String("{'movies': state.movies }".to_string())),
                }),
            }
        };

        let node_from_json = parse_json::<End>(node_json).unwrap();
        assert_eq!(node_from_json, node);
    }

    #[test]
    fn parse_graph() {
        let graph_json = r#"{"nodes":[{"id":"start","type":"start","ports":[{"id":"out","direction":"output"}],"config":{"kind":"start","initial_state":{"movies":[],"continue":true,"count":0}}},{"id":"node_while","type":"while","ports":[{"id":"in","direction":"input"},{"id":"exit","direction":"output"}],"config":{"kind":"while","condition":{"expression":"state.continue == true","format":"cel"},"max_iterations":10,"body":{"nodes":[{"id":"b_agent","type":"agent","ports":[{"id":"in","direction":"input"},{"id":"out","direction":"output"}],"config":{"kind":"agent","agent_id":"demo-agent","input_mapping":{"fields":{"input":"{{workflow.input_as_text}}"}},"output_mapping":{"to_state":{"agent_output":"agent_output"}},"model":"gpt-4.1-mini","params":{"temperature":0.3}}},{"id":"b_set_accumulate","type":"set_state","ports":[{"id":"in","direction":"input"},{"id":"out","direction":"output"}],"config":{"kind":"set_state","assignments":[{"name":"count","expression":{"expression":"state.count + 1","format":"cel"}},{"name":"movies","expression":{"expression":"state.movies + [input.output_parsed]","format":"cel"}}]}},{"id":"b_if_else","type":"if_else","ports":[{"id":"in","direction":"input"},{"id":"case-0","direction":"output"},{"id":"fallback","direction":"output"}],"config":{"kind":"if_else","cases":[{"label":"case-0","output_port_id":"case-0","predicate":{"expression":"size(state.movies) == 3","format":"cel"}}],"fallback":{"label":"fallback","output_port_id":"fallback"}}},{"id":"b_set_continue","type":"set_state","ports":[{"id":"in","direction":"input"},{"id":"out","direction":"output"}],"config":{"kind":"set_state","assignments":[{"name":"continue","expression":{"expression":"false","format":"cel"}}]}}],"edges":[{"id":"b_e1","source_node_id":"b_agent","source_port_id":"out","target_node_id":"b_set_accumulate","target_port_id":"in"},{"id":"b_e2","source_node_id":"b_set_accumulate","source_port_id":"out","target_node_id":"b_if_else","target_port_id":"in"},{"id":"b_e3","source_node_id":"b_if_else","source_port_id":"case-0","target_node_id":"b_set_continue","target_port_id":"in"}]}}},{"id":"node_transform_result","type":"transform","ports":[{"id":"in","direction":"input"},{"id":"out","direction":"output"}],"config":{"kind":"transform","mode":"expression","expr":{"expression":"{ 'result': state.movies }","format":"cel"}}},{"id":"node_approval","type":"approval","ports":[{"id":"in","direction":"input"},{"id":"on_approve","direction":"output"},{"id":"on_reject","direction":"output"}],"config":{"kind":"approval","message":"Approve?  {{input.result}}","variable_mapping":[{"name":"input.result","expression":{"expression":"input.result","format":"cel"}}]}},{"id":"node_end_success","type":"end","ports":[{"id":"in","direction":"input"}],"config":{"kind":"end","output_selector":{"mode":"expression","expression":"{'movies': state.movies }"}}}],"edges":[{"id":"e_start_while","source_node_id":"start","source_port_id":"out","target_node_id":"node_while","target_port_id":"in"},{"id":"e_while_exit_transform","source_node_id":"node_while","source_port_id":"exit","target_node_id":"node_transform_result","target_port_id":"in"},{"id":"e_transform_approval","source_node_id":"node_transform_result","source_port_id":"out","target_node_id":"node_approval","target_port_id":"in"},{"id":"e_approval_approve_end","source_node_id":"node_approval","source_port_id":"on_approve","target_node_id":"node_end_success","target_port_id":"in"}]}"#;
        let graph = parse_json::<Graph>(graph_json).unwrap();
        assert_eq!(graph.nodes.len(), 5);
        assert_eq!(graph.edges.len(), 4);
    }
}