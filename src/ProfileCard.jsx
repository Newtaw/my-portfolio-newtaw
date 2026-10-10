export function ProfileCard({name}){
    return (
        <div className = "profile-card">
            <h2>Profile : {name}</h2>
            <Button text = {name}/>
        </div>
    )
}
export function Footer(){
    return (
        <footer>Power By © 2024 IG342 Studio Co.,Ltd.</footer>
  );
}

export function Button({text}){
    return(
        <button onClick={() => alert(text)} >{text}</button>
    )
}

export function Header() 
{
  return (<h1>Welcome to My App</h1>);
}