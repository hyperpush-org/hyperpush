type Shape do
  Circle(Float)
  Point
end deriving(Json)

struct Drawing do
  shapes :: List<Shape>
  name :: String
end deriving(Json)

fn main() do
  let d = Drawing {
    shapes: [Circle(1.0), Point, Circle(2.5)],
    name: "test"
  }
  let json_str = Json.encode(d)
  println(json_str)
end
