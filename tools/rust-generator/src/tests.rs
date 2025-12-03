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
}