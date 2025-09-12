import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  role: string;
  guardType: string;
}

const PersonnelManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <h2>Personnel Management</h2>
      <p>Insert option to view users - all users or by type</p>
      <p>Insert option to delete users</p>
      <ul>
        {users.map((user) => (
          <li key={user._id}>{user.name} - Role: {user.role} - Guard Type: {user.guardType}</li>
        ))}
      </ul>
    </div>
  );
};

export default PersonnelManagement;
