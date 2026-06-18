async function test() {
  const res = await fetch('http://localhost:5000/api/rooms?collegeLat=18.5292&collegeLng=73.8565&maxDistance=100');
  const data = await res.json();
  console.log('First room:', data[0]?.title);
  console.log('Distance to college:', data[0]?.distanceToCollege);
  console.log('Location:', data[0]?.lat, data[0]?.lng);
}
test();
