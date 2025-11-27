import React, { useState, useEffect } from 'react';
import { fetchEmployees } from '../utils/api';

interface User {
  _id: string;
  name: string;
  role: string;
  guardType: string;
}

const Personnel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    try {
      const data = await fetchEmployees();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>

      <h2>Personnel Management</h2>
      <p> TODO: Insert option to view users - all users or by type</p>
      <p> TODO: Insert option to delete users</p>
      <ul>
        {users.map((user) => (
          <li key={user._id}>{user.name} - Role: {user.role} - Guard Type: {user.guardType}</li>
        ))}
      </ul>
    </div>
  );
};

export default Personnel;
