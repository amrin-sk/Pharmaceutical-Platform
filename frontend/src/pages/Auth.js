import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');

  const handleSubmit = async () => {
    try {
      if (isLogin) {
        const res = await loginUser({ username, password });
        localStorage.setItem('token', res.data.access);
        navigate('/dashboard');
      } else {
        await registerUser({ username, password, role });
        alert('Registered successfully');
        setIsLogin(true);
      }
    } catch (err) {
  console.log(err.response);   // 🔥 IMPORTANT

  alert(JSON.stringify(err.response?.data));
}
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>

      <input
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
      /><br /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      /><br /><br />

      {!isLogin && (
        <>
          <select onChange={(e) => setRole(e.target.value)}>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
          <br /><br />
        </>
      )}

      <button onClick={handleSubmit}>
        {isLogin ? 'Login' : 'Register'}
      </button>

      <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: 'pointer' }}>
        {isLogin ? 'Create account' : 'Already have account?'}
      </p>
    </div>
  );
};

export default Auth;