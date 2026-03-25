const fs = require('fs');
fetch('http://localhost:3000/api/posts/user/student/1/activity')
  .then(r => r.json())
  .then(data => fs.writeFileSync('debug_error.json', JSON.stringify(data, null, 2)));
