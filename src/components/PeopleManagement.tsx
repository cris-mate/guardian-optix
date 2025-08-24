import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  role: string;
  guardType: string;
}

const PeopleManagement: React.FC = () => {
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
      <h2>People Management</h2>
      <ul>
        {users.map((user) => (
          <li key={user._id}>{user.name} - Role: {user.role} - Guard Type: {user.guardType}</li>
        ))}
      </ul>
    </div>
  );
};

export default PeopleManagement;
