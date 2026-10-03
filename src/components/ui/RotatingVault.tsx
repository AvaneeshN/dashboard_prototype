'use client';

import React from 'react';
import { ArcReactor, ArcReactorProps } from './ArcReactor';

export type RotatingVaultProps = ArcReactorProps;

export const RotatingVault: React.FC<RotatingVaultProps> = (props) => {
  return <ArcReactor {...props} />;
};

export { ArcReactor };
