struct Inner do
  value :: Int
end deriving(Json)

struct Outer do
  name :: String
  count :: Int
  inner :: Inner
end deriving(Json)

fn verify_outer(d :: Outer, name :: String, count :: Int, inner_val :: Int, label :: String) do
  if d.name == name do
    if d.count == count do
      if d.inner.value == inner_val do
        println("${label}: ok")
      else
        println("${label}: inner mismatch")
      end
    else
      println("${label}: count mismatch")
    end
  else
    println("${label}: name mismatch")
  end
end

fn main() do
  let orig = Outer {
    name: "test",
    count: 42,
    inner: Inner { value: 99 }
  }
  let json_str = Json.encode(orig)
  let result = Outer.from_json(json_str)
  case result do
    Ok(decoded) -> verify_outer(decoded, "test", 42, 99, "round-trip")
    Err(e1) -> println("Error: ${e1}")
  end

  let orig2 = Outer {
    name: "empty",
    count: 0,
    inner: Inner { value: 0 }
  }
  let json_str2 = Json.encode(orig2)
  let result2 = Outer.from_json(json_str2)
  case result2 do
    Ok(decoded2) -> verify_outer(decoded2, "empty", 0, 0, "zero-values")
    Err(e2) -> println("Error: ${e2}")
  end
end
