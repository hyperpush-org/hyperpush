struct Config do
  tags :: List<String>
  settings :: Map<String, Int>
end deriving(Json)

fn print_results(tags_len :: Int, settings_size :: Int) do
  println("${tags_len}")
  println("${settings_size}")
end

fn main() do
  let c = Config {
    tags: ["web", "api", "prod"],
    settings: %{ "port" => 8080, "workers" => 4 }
  }
  let json_str = Json.encode(c)
  println(json_str)

  let result = Config.from_json(json_str)
  case result do
    Ok(c2) -> print_results(List.length(c2.tags), Map.size(c2.settings))
    Err(e) -> println("Error: ${e}")
  end
end
