
# Livedbs
i have created livedbs for database usage 
my project name is in livedbs : vibex 
my api key is : 37160f2e00721d906831565829ae1de7

### List Projects
https://link.thelocalrent.com/api/db/projects

fetch('https://link.thelocalrent.com/api/db/projects', {
    headers: { 'Authorization': 'Bearer 37160f2e00721d906831565829ae1de7' }
})
.then(response => response.json())
.then(data => console.log(data));

### create projects
https://link.thelocalrent.com/api/db/projects

fetch('https://link.thelocalrent.com/api/db/projects', {
    method: 'POST',
    headers: { 
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ 
        name: 'my_new_app', 
        description: 'Production Database' 
    })
}).then(r => r.json()).then(console.log);

### get List Collections
https://link.thelocalrent.com/api/db/{project_name}
fetch('https://link.thelocalrent.com/api/db/my_new_app', {
    headers: { 'Authorization': 'Bearer 37160f2e00721d906831565829ae1de7' }
})
.then(r => r.json())
.then(console.log);


### Create Document
https://link.thelocalrent.com/api/db/{project}/{collection}

// Create a User in 'users' collection
fetch('https://link.thelocalrent.com/api/db/my_new_app/users', {
    method: 'POST',
    headers: { 
        'Authorization': 'Bearer 37160f2e00721d906831565829ae1de7',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
        username: 'john_doe', 
        email: 'john@example.com',
        stats: { logins: 5, active: true }
    })
}).then(r => r.json()).then(console.log);


### Query Documents
https://link.thelocalrent.com/api/db/{project}/{collection}

// 1. Simple Equality (Case-Insensitive):
fetch('https://link.thelocalrent.com/api/db/my_new_app/users?role=admin')

// 2. Comparison Operators (gt, gte, lt, lte, ne):
// Get users older than 18:
fetch('https://link.thelocalrent.com/api/db/my_new_app/users?age[gt]=18')

// Get users created before 2024:
fetch('https://link.thelocalrent.com/api/db/my_new_app/users?created_at[lt]=2024-01-01')

// 3. Pattern Match (like):
// Get users with email containing "gmail":
fetch('https://link.thelocalrent.com/api/db/my_new_app/users?email[like]=gmail')

// 4. List Check (in):
// Get users with status active OR pending:
fetch('https://link.thelocalrent.com/api/db/my_new_app/users?status[in]=active,pending')

// 5. Complex Combination:
// Admins older than 25, active, name contains "John":
fetch('https://link.thelocalrent.com/api/db/my_new_app/users?role=admin&age[gt]=25&status=active&name[like]=John')

// 6. Pagination & Sorting:
// Page 2, 20 per page, Sort by age descending:
fetch('https://link.thelocalrent.com/api/db/my_new_app/users?_page=2&_per_page=20&_sort=age:desc')


### Update Document
https://link.thelocalrent.com/api/db/{project}/{collection}/{id}

fetch('https://link.thelocalrent.com/api/db/my_new_app/users/123', {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer TOKEN', 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: false }) // Merges/Updates fields
})


### Delete Document
https://link.thelocalrent.com/api/db/{project}/{collection}/{id}

fetch('https://link.thelocalrent.com/api/db/my_new_app/users/123', {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer TOKEN' }
})

