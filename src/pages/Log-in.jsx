import {BrowserRouter, Routes, Route, Link, useParams} from 'react-router-dom';
import '..\\styles\\login.css'

export default function Login(){
    return(
        <>
            <div className='login'>
                <fieldset> 
                    <legend>Log-in</legend>
                    <input type='email' className='email' placeholder='name@gmail.com'/><br/>
                    <input type='password' className='password' placeholder='Password'/>
                </fieldset>
            </div>
        </>
    );
}