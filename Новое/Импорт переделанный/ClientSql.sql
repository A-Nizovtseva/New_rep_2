USE [bd_dem]
GO

/****** Object:  Table [dbo].[Client]    Script Date: 25.05.2022 6:51:03 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Client](
	[ClientCode] [int] IDENTITY(1,1) NOT NULL,
	[ClientSurname] [varchar](50) NOT NULL,
	[ClientName] [varchar](100) NOT NULL,
	[ClientPatronymic] [varchar](50) NOT NULL,
	[ClientPassSeries] [int] NOT NULL,
	[ClientPassNumber] [int] NOT NULL,
	[ClientBirthDate] [date] NOT NULL,
	[ClientAddressIndex] [int] NOT NULL,
	[ClientCity] [varchar](100) NOT NULL,
	[ClientStreet] [varchar](100) NOT NULL,
	[ClientHouse] [int] NOT NULL,
	[ClientFlat] [int] NOT NULL,
	[ClientEmail] [varchar](50) NOT NULL,
	[ClientPassword] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Client] PRIMARY KEY CLUSTERED 
(
	[ClientCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


