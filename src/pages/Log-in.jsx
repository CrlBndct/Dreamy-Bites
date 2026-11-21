import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../styles/login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault(); // stops the page from reloading on submit

    if (!email.includes('@') || password.length < 4) {
      setError('Enter a valid email and a password (4+ characters).');
      return;
    }

    const user = login(email, password);

    if (!user) {
      setError('Incorrect password.');
      return;
    }

    navigate(user.role === 'baker' ? '/baker' : '/homepage');
  };

  return (
    <form className="login" onSubmit={handleLogin}>
      <fieldset>
        <legend>Log-in</legend>

        <input
          type="email"
          className="email"
          placeholder="name@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" className="logbtn">Login</button>
      </fieldset>
    </form>
  );
}