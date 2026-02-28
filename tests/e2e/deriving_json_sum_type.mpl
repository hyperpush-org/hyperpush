type Shape do
  Circle(Float)
  Rectangle(Float, Float)
  Point
end deriving(Json)

fn verify_circle(s :: Shape) do
  case s do
    Circle(r) -> println("circle: ${r}")
    Rectangle(_, _) -> println("wrong: rectangle")
    Point -> println("wrong: point")
  end
end

fn verify_point(s :: Shape) do
  case s do
    Point -> println("point: ok")
    Circle(_) -> println("wrong: circle")
    Rectangle(_, _) -> println("wrong: rectangle")
  end
end

fn main() do
  let c = Circle(3.14)
  let json_str1 = Json.encode(c)
  println(json_str1)

  let r = Rectangle(2.0, 5.0)
  let json_str2 = Json.encode(r)
  println(json_str2)

  let p = Point
  let json_str3 = Json.encode(p)
  println(json_str3)

  let result = Shape.from_json(json_str1)
  case result do
    Ok(decoded) -> verify_circle(decoded)
    Err(e1) -> println("Error: ${e1}")
  end

  let result2 = Shape.from_json(json_str3)
  case result2 do
    Ok(decoded2) -> verify_point(decoded2)
    Err(e2) -> println("Error: ${e2}")
  end
end
