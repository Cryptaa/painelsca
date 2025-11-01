import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const useSubscriptionCheck = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is admin
      const { data: roles } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (roles) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      // Check subscription
      const { data: subscription } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subscription) {
        // Check if trial has expired
        if (subscription.is_trial && subscription.trial_end_at) {
          const trialEnd = new Date(subscription.trial_end_at);
          const now = new Date();
          
          if (now > trialEnd) {
            setHasAccess(false);
            navigate('/assinaturas');
            return;
          }
        }
        
        // Check if subscription has ended
        if (subscription.end_date) {
          const endDate = new Date(subscription.end_date);
          const now = new Date();
          
          if (now > endDate) {
            setHasAccess(false);
            navigate('/assinaturas');
            return;
          }
        }
        
        setHasAccess(true);
      } else {
        // No subscription found
        setHasAccess(false);
        navigate('/assinaturas');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, hasAccess };
};
