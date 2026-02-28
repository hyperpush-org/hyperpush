struct Numbers do
  i :: Int
  f :: Float
end deriving(Json)

fn show_numbers(n :: Numbers) do
  println("${n.i}")
  println("${n.f}")
  println("${n.i + 1}")
  println("${n.f + 0.01}")
end

fn main() do
  let n = Numbers { i: 42, f: 3.14 }
  let json_str = Json.encode(n)
  println(json_str)

  let result = Numbers.from_json(json_str)
  case result do
    Ok(n2) -> show_numbers(n2)
    Err(e) -> println("Error: ${e}")
  end
end
