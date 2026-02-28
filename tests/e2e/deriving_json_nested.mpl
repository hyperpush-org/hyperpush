struct Address do
  city :: String
  zip :: Int
end deriving(Json)

struct Person do
  name :: String
  addr :: Address
end deriving(Json)

fn show_person(p :: Person) do
  println(p.name)
  println(p.addr.city)
  println("${p.addr.zip}")
end

fn main() do
  let p = Person { name: "Bob", addr: Address { city: "NYC", zip: 10001 } }
  let json_str = Json.encode(p)
  println(json_str)

  let result = Person.from_json(json_str)
  case result do
    Ok(p2) -> show_person(p2)
    Err(e) -> println("Error: ${e}")
  end
end
