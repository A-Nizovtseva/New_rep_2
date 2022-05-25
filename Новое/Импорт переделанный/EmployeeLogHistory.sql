USE [bd_dem]
GO

/****** Object:  Table [dbo].[EmployeeLogHistory]    Script Date: 25.05.2022 6:52:19 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[EmployeeLogHistory](
	[LogId] [int] IDENTITY(1,1) NOT NULL,
	[EmployeeLogin] [varchar](50) NOT NULL,
	[LogDateTime] [datetime] NOT NULL,
	[LogIsSuccessful] [bit] NOT NULL,
 CONSTRAINT [PK_EmployeeLogHistory] PRIMARY KEY CLUSTERED 
(
	[LogId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


