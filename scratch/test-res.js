const fetch = require('node-fetch'); fetch('http://localhost:5173/api/resolve-spec', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'Toyota RAV4'})}).then(r= 
