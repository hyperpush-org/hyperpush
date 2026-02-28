// Expected output: 1705312200
fn main() do
  let r = DateTime.from_unix_secs(1705312200)
  case r do
    Ok(dt) ->
      let secs = DateTime.to_unix_secs(dt)
      println(secs)
    Err(e) -> println(e)
  end
end
