import {BrowserRouter, Routes, Route, Link, useParams, useNavigate} from 'react-router-dom';
import '..\\styles\\login.css'

export default function Login(){

    return(
        <>
            <div className='login'>
                <fieldset> 
                    <legend>Log-in</legend>
                    <input type='email' className='email' placeholder='name@gmail.com'/><br/>
                    <input type='password' className='password' placeholder='Password'/>
                    <Link to = "/homepage" className='logbtn'>Login</Link>
                </fieldset>
            </div>
        </>
    );
}