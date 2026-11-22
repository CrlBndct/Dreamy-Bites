// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../AuthContext';
// import '../styles/login.css';

// export default function Login() {
//   const navigate = useNavigate();
//   const { login, register } = useAuth();

//   const [mode, setMode] = useState('login'); // login | register
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [busy, setBusy] = useState(false);

//   const isRegister = mode === 'register';

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!email.includes('@') || !password) {
//       setError('Enter your email and password.');
//       return;
//     }
//     if (isRegister && password.length < 6) {
//       setError('Password must be at least 6 characters.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     try {
//       const user = isRegister ? await register(email, password) : await login(email, password);
//       navigate(user.role === 'baker' ? '/baker' : '/homepage');
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setBusy(false);
//     }
//   };

//   const switchMode = () => {
//     setMode(isRegister ? 'login' : 'register');
//     setError('');
//   };

//   return (
//     <form className="login" onSubmit={handleSubmit}>
//       <fieldset>
//         <legend>{isRegister ? 'Create account' : 'Log-in'}</legend>

//         <input
//           type="email"
//           className="email"
//           placeholder="name@gmail.com"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />

//         <input
//           type="password"
//           className="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />

//         {error && <p className="error">{error}</p>}

//         <button type="submit" className="logbtn" disabled={busy}>
//           {busy ? '...' : isRegister ? 'Register' : 'Login'}
//         </button>

//         <button type="button" className="switch" onClick={switchMode}>
//           {isRegister ? 'Already have an account? Log in' : 'No account yet? Register'}
//         </button>
//       </fieldset>
//     </form>
//   );
// }


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../styles/login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail.includes('@') || !password) {
      setError('Enter your email and password.');
      return;
    }

    if (isRegister && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const user = isRegister
        ? await register(cleanEmail, password)
        : await login(cleanEmail, password);

      navigate(user.role === 'baker' ? '/baker' : '/homepage');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setError('');
    setPassword('');
  };

  return (
    <form className="login" onSubmit={handleSubmit}>
      <fieldset>
        <legend>{isRegister ? 'Create account' : 'Log-in'}</legend>

        <input
          type="email"
          className="email"
          placeholder="name@gmail.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          required
        />

        <input
          type="password"
          className="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" className="logbtn" disabled={busy}>
          {busy ? '...' : isRegister ? 'Register' : 'Login'}
        </button>

        <button type="button" className="switch" onClick={switchMode}>
          {isRegister
            ? 'Already have an account? Log in'
            : 'No account yet? Register'}
        </button>
      </fieldset>
    </form>
  );
}
