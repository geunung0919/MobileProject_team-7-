async function showUser(){
    const res = await fetch(
        "https://jsonplaceholder.typicode.com/users");
    const user = await res.json();

    user.forEach( u =>
        console.log(`${u.name} (${u.email})`));
}
showUser();
