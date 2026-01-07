-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  role text check (role in ('admin', 'customer')) default 'customer',
  full_name text,
  subscription_plan text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for tickets
create table tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  title text not null,
  description text,
  status text check (status in ('open', 'in_progress', 'resolved')) default 'open',
  priority text check (priority in ('low', 'medium', 'high')) default 'low',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tickets enable row level security;

create policy "Users can view their own tickets." on tickets
  for select using (auth.uid() = user_id);

create policy "Users can create their own tickets." on tickets
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all tickets." on tickets
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update all tickets." on tickets
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Create a table for payments
create table payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  amount decimal not null,
  status text check (status in ('pending', 'paid', 'failed')) default 'pending',
  payment_date timestamp with time zone,
  invoice_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table payments enable row level security;

create policy "Users can view their own payments." on payments
  for select using (auth.uid() = user_id);

create policy "Admins can view all payments." on payments
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
