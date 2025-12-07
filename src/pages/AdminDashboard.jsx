
import React, { useState, useEffect } from 'react';
import { User, Community, Notification } from '@/entities/all';
import { ArrowLeft, Users, Shield, Crown, MoreVertical, Ban, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminDashboard({ onBack }) {
  const [users, setUsers] = useState([]);
  const [pendingCommunities, setPendingCommunities] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, premium: 0, admins: 0, banned: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [allUsers, pendingComms] = await Promise.all([
          User.list('-created_date'),
          Community.filter({ is_approved: false })
      ]);
      
      setUsers(allUsers);
      setPendingCommunities(pendingComms);
      
      // טעינת התראות אבטחה
      try {
        const currentUser = await User.me();
        const alerts = await Notification.filter({ 
          recipient_email: currentUser.email, 
          type: 'security_alert' 
        }, '-created_date', 20);
        setSecurityAlerts(alerts);
      } catch (alertsError) {
        console.error('Failed to load security alerts:', alertsError);
      }
      
      // Calculate stats
      const total = allUsers.length;
      const premium = allUsers.filter(u => u.subscription_tier === 'premium').length;
      const admins = allUsers.filter(u => u.role === 'admin').length;
      const banned = allUsers.filter(u => u.is_banned).length;
      setStats({ total, premium, admins, banned });

    } catch (error) {
      console.error("Failed to fetch admin data", error);
      toast.error("Could not load admin data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (user, newRole) => {
    try {
      await User.update(user.id, { role: newRole });
      toast.success(`${user.full_name}'s role updated to ${newRole}.`);
      fetchData(); // Refresh list
    } catch (e) {
      toast.error("Failed to update role.");
    }
  };

  const handleToggleBan = async (user) => {
    const willBeBanned = !user.is_banned;
    if (!window.confirm(`Are you sure you want to ${willBeBanned ? 'ban' : 'unban'} ${user.full_name}?`)) {
      return;
    }
    try {
      await User.update(user.id, { is_banned: willBeBanned });
      toast.success(`User ${willBeBanned ? 'banned' : 'unbanned'}.`);
      fetchData(); // Refresh list
    } catch (e) {
      toast.error("Failed to update ban status.");
    }
  };
  
  const handleCommunityApproval = async (community, approve) => {
    const action = approve ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} the community "${community.name}"?`)) {
      return;
    }
    
    try {
      if (approve) {
        await Community.update(community.id, { is_approved: true });
        toast.success("Community approved!");
      } else {
        await Community.delete(community.id);
        toast.info("Community rejected and removed.");
      }
      fetchData(); // Refresh list
    } catch (e) {
      console.error(`Failed to ${action} community`, e);
      toast.error(`Could not ${action} community.`);
    }
  };

  // אישור כל התראות האבטחה
  const handleMarkAllAlertsRead = async () => {
    try {
      for (const alert of securityAlerts.filter(a => !a.is_read)) {
        await Notification.update(alert.id, { is_read: true });
      }
      toast.success("All security alerts marked as read");
      fetchData();
    } catch (error) {
      toast.error("Could not mark alerts as read");
    }
  };
  
  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-600">{title}</h3>
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-blue-100 flex items-center">
        <button onClick={onBack} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-blue-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 ml-4 flex items-center">
            <Shield className="w-6 h-6 text-blue-600 mr-2" />
            Admin Dashboard
        </h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Security Alerts - NEW SECTION */}
        {securityAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-red-100 border-b border-red-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-red-800 flex items-center">
                🚨 Security Alerts ({securityAlerts.filter(a => !a.is_read).length} unread)
              </h2>
              <button 
                onClick={handleMarkAllAlertsRead}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
              >
                Mark All Read
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {securityAlerts.slice(0, 10).map(alert => (
                <div key={alert.id} className={`p-3 border-b border-red-100 ${!alert.is_read ? 'bg-red-50' : 'bg-white'}`}>
                  <p className="text-sm text-red-800 font-medium">{alert.content}</p>
                  <p className="text-xs text-red-600 mt-1">
                    {new Date(alert.created_date).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats.total} icon={Users} color="border-blue-500" />
          <StatCard title="Premium" value={stats.premium} icon={Crown} color="border-yellow-500" />
          <StatCard title="Admins" value={stats.admins} icon={ShieldCheck} color="border-green-500" />
          <StatCard title="Banned" value={stats.banned} icon={Ban} color="border-red-500" />
        </div>

        {/* Pending Communities */}
        {pendingCommunities.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <h2 className="p-4 text-lg font-bold text-slate-800 border-b">Pending Communities for Approval</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Community</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       {pendingCommunities.map(comm => (
                          <TableRow key={comm.id}>
                            <TableCell>
                              <div className="font-medium text-slate-900">{comm.name}</div>
                              <div className="text-sm text-slate-500 truncate max-w-xs">{comm.description}</div>
                            </TableCell>
                            <TableCell>{comm.creator_name}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleCommunityApproval(comm, true)}>
                                  <CheckCircle className="w-4 h-4 mr-2"/> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleCommunityApproval(comm, false)}>
                                  <XCircle className="w-4 h-4 mr-2"/> Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                  </Table>
                </div>
            </div>
        )}

        {/* User Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <h2 className="p-4 text-lg font-bold text-slate-800 border-b">User Management</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan="4" className="text-center">Loading users...</TableCell></TableRow>
                  ) : (
                    users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium text-slate-900">{user.full_name}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-green-100 text-green-800' : ''}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.is_banned ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Active</Badge>
                          )}
                          {user.subscription_tier === 'premium' && <Badge className="ml-2 bg-yellow-100 text-yellow-800">Premium</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleUpdateRole(user, 'admin')}>
                                Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateRole(user, 'user')}>
                                Make User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleToggleBan(user)}
                                className={user.is_banned ? "text-green-600 focus:text-green-700" : "text-red-600 focus:text-red-700"}
                              >
                                {user.is_banned ? 'Unban User' : 'Ban User'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
        </div>
      </div>
    </div>
  );
}
