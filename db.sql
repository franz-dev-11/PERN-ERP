--
-- PostgreSQL database dump
--

\restrict pIh5SicfgH0Le5C3uhnKDmY4Vtttx4UAI3BBtQOP4Y9GtKMQ2oI0EqU82nBk5hz

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: erp_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.erp_modules (
    module_name character varying(50) NOT NULL,
    functionality character varying(255)
);


ALTER TABLE public.erp_modules OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    permission_name character varying(50) NOT NULL,
    module_name character varying(50),
    description character varying(255)
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL,
    description character varying(255),
    assigned_permissions text
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: user_roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_role_id_seq OWNER TO postgres;

--
-- Name: user_roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_role_id_seq OWNED BY public.user_roles.role_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100),
    password_hash character varying(255) NOT NULL,
    role_id character varying(50),
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: user_roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN role_id SET DEFAULT nextval('public.user_roles_role_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: erp_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.erp_modules (module_name, functionality) FROM stdin;
Data & Analytics	Viewing high-level data and operational snapshots.
Accounts	Managing system users (HR/IT function).
Inventory	Managing stock levels and warehouse data.
Inbound	Procurement and receiving goods. (Often Purchasing Dept. )
Outbound	Fulfillment and shipping goods. (Often Sales/Logistics Dept. )
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (permission_name, module_name, description) FROM stdin;
View_Dashboard	Data & Analytics	Access the main performance dashboard.
View_Inventory	Inventory	View stock levels and inventory reports.
Manage_Users_Create	Accounts	Create new user accounts.
Manage_Users_View	Accounts	View list of existing users (Show Users).
Procurement_Create_PO	Inbound	Access/Create Purchasing orders.
Pricing_Inbound_Set	Inbound	Set or modify pricing terms for incoming goods.
Delivery_Inbound_Record	Inbound	Record inbound deliveries and receipt of goods.
Sales_Record	Outbound	Create and record new sales transactions.
Pricing_Outbound_Set	Outbound	Set or modify pricing terms for outgoing sales.
Delivery_Outbound_Dispatch	Outbound	Process and dispatch outbound deliveries.
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (role_id, role_name, description, assigned_permissions) FROM stdin;
1	System Administrator	Full control over users and general oversight.	View_Dashboard, View_Inventory, Manage_Users_Create, Manage_Users_View (and likely all other permissions for full access)
2	Purchasing Agent	Manages the intake and procurement process.	Procurement_Create_PO, Delivery_Inbound_Record, Pricing_Inbound_Set
3	Sales Manager	Manages sales recording and pricing strategy.	View_Dashboard, Sales_Record, Pricing_Outbound_Set
4	Warehouse Clerk	Handles the physical movement of goods.	View_Inventory, Delivery_Inbound_Record, Delivery_Outbound_Dispatch
5	Executive / Analyst	Needs high-level oversight and reporting.	View_Dashboard, View_Inventory, Manage_Users_View
6	Data Entry Clerk	Limited access to record basic transactions.	Sales_Record, Procurement_Create_PO
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, full_name, email, password_hash, role_id, status) FROM stdin;
1	Janzy	Mark Janolino	mak.janolino@gmail.com	$2b$10$QsNegPnp0iHni2KzvFs5DOlOSUs1BYCp7Sw.u7vD7ahauhDZUxnTK	1	Active
\.


--
-- Name: user_roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_roles_role_id_seq', 6, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 1, true);


--
-- Name: erp_modules erp_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.erp_modules
    ADD CONSTRAINT erp_modules_pkey PRIMARY KEY (module_name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (permission_name);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (role_id);


--
-- Name: user_roles user_roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_name_key UNIQUE (role_name);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: permissions permissions_module_name_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_module_name_fkey FOREIGN KEY (module_name) REFERENCES public.erp_modules(module_name);


--
-- PostgreSQL database dump complete
--

\unrestrict pIh5SicfgH0Le5C3uhnKDmY4Vtttx4UAI3BBtQOP4Y9GtKMQ2oI0EqU82nBk5hz

