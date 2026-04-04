'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, Clock, User, Search } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppointmentDialog } from './components/appointment-dialog';
import { useTranslations } from 'next-intl';

export default function AppointmentsPage() {
  const t = useTranslations('appointments');
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  useEffect(() => {
    fetchAppointments();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = appointments.filter(
        (apt) =>
          apt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAppointments(filtered);
    } else {
      setFilteredAppointments(appointments);
    }
  }, [searchQuery, appointments]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
        setFilteredAppointments(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setLoading(false);
    }
  };

  const handleEdit = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowDialog(true);
  };

  const handleNew = () => {
    setSelectedAppointment(null);
    setShowDialog(true);
  };

  const handleSuccess = () => {
    fetchAppointments();
    setShowDialog(false);
    setSelectedAppointment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'no_show':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const upcomingAppointments = filteredAppointments.filter(
    (apt) => new Date(apt.appointmentDate) >= new Date() && apt.status === 'scheduled'
  );

  const pastAppointments = filteredAppointments.filter(
    (apt) => new Date(apt.appointmentDate) < new Date() || apt.status !== 'scheduled'
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          {t('newAppointment')}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t('upcoming')} ({upcomingAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">
              {t('loading')}
            </p>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">{t('noUpcoming')}</p>
              <Button variant="outline" onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" />
                {t('scheduleFirst')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => handleEdit(appointment)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{appointment.title}</h3>
                      <Badge className={getStatusColor(appointment.status)}>
                        {t(`statuses.${appointment.status}`)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{appointment.customer.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{formatDateTime(appointment.appointmentDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{appointment.duration} min</span>
                      </div>
                    </div>
                    {appointment.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                        {appointment.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('past')} ({pastAppointments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastAppointments.slice(0, 10).map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer opacity-75"
                  onClick={() => handleEdit(appointment)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{appointment.title}</h3>
                      <Badge className={getStatusColor(appointment.status)}>
                        {t(`statuses.${appointment.status}`)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{appointment.customer.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{formatDateTime(appointment.appointmentDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Dialog */}
      <AppointmentDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        appointment={selectedAppointment}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
