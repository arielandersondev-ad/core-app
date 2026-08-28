import { redirect } from 'next/navigation';

export default function OrgsRedirect() {
  redirect('/dashboard/organizations');
}