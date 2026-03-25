'use client';

import Image from 'next/image';
import type { RoleBranding } from '@/constants/role-branding';

export default function RoleLogo({
  branding,
  size = 32,
  width,
  height,
  className = 'rounded-full object-contain',
}: Readonly<{
  branding: RoleBranding;
  size?: number;
  width?: number;
  height?: number;
  className?: string;
}>) {
  const resolvedWidth = width ?? size;
  const resolvedHeight = height ?? size;

  return (
    <Image
      src={branding.logoSrc}
      alt={branding.logoAlt}
      width={resolvedWidth}
      height={resolvedHeight}
      className={className}
    />
  );
}
