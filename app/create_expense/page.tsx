'use client';

import { useState } from 'react';
import CreateExpenseModal from '../../components/CreateExpenseModal';
import '../../components/CreateExpenseModal.css';

export default function Page() {
  const [isModalVisible, setIsModalVisible] = useState(true);

  let curUserId = "10"; // Temp test id; REPLACE LATER
  let curHouseholdID = "4"; // Temp test id; REPLACE LATER

  return (
    <CreateExpenseModal
        isOpen          = {isModalVisible}
        onClose         = {() => setIsModalVisible(false)}
        onSuccess       = {() => setIsModalVisible(false)}
        curUserID       = {curUserId}
        curHouseholdID  = {curHouseholdID}
    />
  );
}