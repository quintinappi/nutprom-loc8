import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const UserTableRow = ({ 
  user, 
  editingCode, 
  newCode, 
  onRoleChange, 
  onCodeEdit, 
  onCodeSave, 
  onNewCodeChange,
  onUpdatePassword,
  onDelete 
}) => {
  return (
    <TableRow>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.role}</TableCell>
      <TableCell>
        <Select
          value={user.role}
          onValueChange={(value) => onRoleChange(user.id, value)}
        >
          <SelectTrigger>
            <SelectValue>{user.role}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        {editingCode === user.id ? (
          <div className="flex gap-2">
            <Input
              type="text"
              value={newCode}
              onChange={(e) => onNewCodeChange(e.target.value)}
              maxLength={4}
              pattern="\d*"
              className="w-24"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onCodeSave(user.id)}
            >
              Save
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <span>{user.code}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onCodeEdit(user.id, user.code)}
            >
              Edit
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdatePassword(user)}
          >
            Update Password
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(user.id)}
          >
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;