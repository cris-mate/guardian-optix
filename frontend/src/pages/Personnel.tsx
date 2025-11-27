import React, { useState, useEffect } from 'react';
import { fetchEmployees } from '../utils/api';

interface Employee {
  _id: string;
  fullName: string;
  role: string;
  managerType?: string;
  guardType?: string;
  availability: boolean;
  shiftTime?: string;
}

const Personnel: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await fetchEmployees();
      setEmployees(data);
      setError('');
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadEmployees();
  }, []);

  if (loading) return <div>Loading...</div>;

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
            {!emp.availability && ' - Currently Assigned'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Personnel;
