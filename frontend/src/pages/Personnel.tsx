import React, { useState, useEffect } from 'react';
import { fetchEmployees } from '../utils/api';

interface Employee {
  _id: string;
  fullName: string;
  role: string;
  managerType?: string;
  guardType?: string;
  availability: string;
  shiftTime?: string;
}

const Personnel: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState('');

  const loadEmployees = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees.');
    }
  };


  useEffect(() => {
    loadEmployees();
  }, []);

  return (
    <div>

      <h2>Personnel Management</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p> TODO: Insert option to view users - all users or by type</p>
      <p> TODO: Insert option to delete users</p>
      <ul>
        {employees.map((emp) => (
          <li key={emp._id}>
            {emp.fullName} - Role: {emp.role}
            {emp.guardType && ` - Type: ${emp.guardType}`}
            {emp.managerType && ` - Type: ${emp.managerType}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Personnel;
