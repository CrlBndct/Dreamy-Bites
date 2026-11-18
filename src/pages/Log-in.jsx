import {BrowserRouter, Routes, Route, Link, useParams, useNavigate} from 'react-router-dom';
import '..\\styles\\login.css'

export default function Login(){

    function handleNav(){
        const navTo = useNavigate();

        navTo("");
    }


    return(
        <>
            <div className='login'>
                <fieldset> 
                    <legend>Log-in</legend>
                    <input type='email' className='email' placeholder='name@gmail.com'/><br/>
                    <input type='password' className='password' placeholder='Password'/>
                    <button className='logbtn'>Login</button>
                </fieldset>
            </div>
        </>
    );
}