USE [bd_dem]
GO

/****** Object:  Table [dbo].[Employee]    Script Date: 25.05.2022 6:51:53 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Employee](
	[EmployeeCode] [int] NOT NULL,
	[EmployeeType] [varchar](25) NOT NULL,
	[EmployeeSurname] [varchar](50) NOT NULL,
	[EmployeeName] [varchar](50) NOT NULL,
	[EmployeePatronymic] [varchar](50) NOT NULL,
	[EmployeeLogin] [varchar](50) NOT NULL,
	[EmployeePassword] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Employee] PRIMARY KEY CLUSTERED 
(
	[EmployeeCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


