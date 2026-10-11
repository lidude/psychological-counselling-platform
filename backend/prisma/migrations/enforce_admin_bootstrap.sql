-- Migration Script: Enforce Admin Role for Primary Bootstrap Administrator
-- Ensures that salmamustefa@gmail.com has ADMIN role privileges

UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'salmamustefa@gmail.com';
