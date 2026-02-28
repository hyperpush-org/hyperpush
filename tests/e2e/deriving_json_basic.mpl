struct User do
  name :: String
  age :: Int
  score :: Float
  active :: Bool
end deriving(Json)

fn main() do
  let u = User { name: "Alice", age: 30, score: 95.5, active: true }
  let json_str = Json.encode(u)
  println(json_str)

  let result = User.from_json(json_str)
  case result do
    Ok(u2) -> println("${u2.name} ${u2.age} ${u2.active}")
    Err(e) -> println("Error: ${e}")
  end
end
