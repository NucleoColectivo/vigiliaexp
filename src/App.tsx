/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VigiliaAuth } from './components/VigiliaAuth';
import { VigiliaCore } from './components/VigiliaCore';

export default function App() {
  const [accessGranted, setAccessGranted] = useState(false);
  const [userName, setUserName] = useState('ANÓNIMO');

  if (accessGranted) {
    return <VigiliaCore userName={userName} />;
  }

  return (
    <VigiliaAuth 
      onAccessGranted={(name) => {
        setUserName(name);
        setAccessGranted(true);
      }} 
    />
  );
}
