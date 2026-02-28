// Expected output:
// 1705312200000
// 2024-01-15T10:30:00.000Z
fn main() do
  let r = DateTime.from_unix_ms(1705312200000)
  case r do
    Ok(dt) ->
      let ms = DateTime.to_unix_ms(dt)
      println(ms)
      println(DateTime.to_iso8601(dt))
    Err(e) -> println(e)
  end
end
