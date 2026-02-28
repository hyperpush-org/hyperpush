test("Test.mock_actor spawns an actor") do
  let pid = Test.mock_actor(fn(msg) do
    msg
  end)
  let _ = pid
  assert(true)
end

test("assert_receive gets message sent to self") do
  let me = self()
  send(me, 42)
  assert_receive 42, 500
end

test("assert_receive with default timeout") do
  let me = self()
  send(me, 99)
  assert_receive 99
end
