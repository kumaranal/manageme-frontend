import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { Button } from '@/components/ui/Button';

export default function CheckoutCancel() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <h2 className="font-heading text-[28px] leading-tight mb-2">Checkout cancelled</h2>
      <p className="text-neutral-600 mb-6">No payment was made. You can try again whenever you're ready.</p>
      <Button variant="primary" className="w-full" onClick={() => navigate('/orgs/new')}>Back to new organization</Button>
    </AuthLayout>
  );
}
