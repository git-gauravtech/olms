// src/app/dashboard/admin/faculty-requests/page.tsx
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import type { RescheduleRequest, Lab, TimeSlot } from "@/types";
import { MOCK_RESCHEDULE_REQUESTS, MOCK_LABS, MOCK_TIME_SLOTS } from "@/constants";
import { format, parseISO } from "date-fns";
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function FacultyRequestsPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.ADMIN);
  const { toast } = useToast();

  const [requests, setRequests] = React.useState<RescheduleRequest[]>(MOCK_RESCHEDULE_REQUESTS);

  const getLabName = (labId: string) => MOCK_LABS.find(l => l.id === labId)?.name || "Unknown Lab";
  const getTimeSlotDisplay = (timeSlotId: string) => MOCK_TIME_SLOTS.find(ts => ts.id === timeSlotId)?.displayTime || "Unknown Time";
  
  const formatDateSafe = (dateString: string | Date, dateFormat: string = "PPpp") => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return format(date, dateFormat);
    } catch (error) {
      console.error("Invalid date format:", dateString, error);
      return "Invalid Date";
    }
  };

  const handleUpdateRequestStatus = (requestId: string, newStatus: RescheduleRequest['status']) => {
    // Simulate API call
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId ? { ...req, status: newStatus } : req
      )
    );
    // Update the mock data source directly for demo persistence across navigations
    const reqIndex = MOCK_RESCHEDULE_REQUESTS.findIndex(r => r.id === requestId);
    if (reqIndex !== -1) {
      MOCK_RESCHEDULE_REQUESTS[reqIndex].status = newStatus;
    }

    toast({
      title: "Request Updated",
      description: `Request ID ${requestId} has been marked as ${newStatus}.`,
    });
  };

  const getStatusBadgeVariant = (status: RescheduleRequest['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'reviewed': return 'default';
      case 'resolved': return 'default'; // Potentially green, but default works for now
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold">Faculty Reschedule Requests</CardTitle>
          </div>
          <CardDescription>
            Review and manage reschedule requests submitted by faculty members for lab slots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
             <p className="text-center text-muted-foreground py-4">No reschedule requests found.</p>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty ID</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead>Lab</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time Slot</TableHead>
                <TableHead className="min-w-[200px]">Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestingUserId}</TableCell>
                  <TableCell>{formatDateSafe(request.requestedAt)}</TableCell>
                  <TableCell>{getLabName(request.conflictingLabId)}</TableCell>
                  <TableCell>{formatDateSafe(request.conflictingDate, "PP")}</TableCell>
                  <TableCell>{getTimeSlotDisplay(request.conflictingTimeSlotId)}</TableCell>
                  <TableCell className="max-w-xs truncate hover:whitespace-normal hover:overflow-visible" title={request.reason}>{request.reason}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(request.status)} className="capitalize">
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center space-x-1 space-y-1">
                    {request.status === 'pending' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleUpdateRequestStatus(request.id, 'reviewed')} title="Mark as Reviewed">
                           <Info className="mr-1 h-4 w-4" /> Reviewed
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleUpdateRequestStatus(request.id, 'rejected')} title="Reject Request">
                           <XCircle className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                    {request.status === 'reviewed' && (
                      <Button variant="default" size="sm" onClick={() => handleUpdateRequestStatus(request.id, 'resolved')} title="Mark as Resolved">
                         <CheckCircle className="mr-1 h-4 w-4" /> Resolve
                      </Button>
                    )}
                     {(request.status === 'resolved' || request.status === 'rejected') && (
                       <span className="text-xs text-muted-foreground italic">
                         {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                       </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
