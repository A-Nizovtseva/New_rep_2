USE [bd_dem]
GO

/****** Object:  Table [dbo].[Order]    Script Date: 25.05.2022 6:52:44 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Order](
	[OrderId] [int] NOT NULL,
	[OrderCode] [varchar](50) NOT NULL,
	[OrderDate] [date] NOT NULL,
	[OrderTime] [time](7) NOT NULL,
	[ClientCode] [int] NOT NULL,
	[OrderStatus] [varchar](50) NOT NULL,
	[OrderClosingDate] [date] NULL,
	[OrderRentTime] [int] NOT NULL,
 CONSTRAINT [PK_Order] PRIMARY KEY CLUSTERED 
(
	[OrderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[Order]  WITH CHECK ADD  CONSTRAINT [FK_Order_Client] FOREIGN KEY([ClientCode])
REFERENCES [dbo].[Client] ([ClientCode])
GO

ALTER TABLE [dbo].[Order] CHECK CONSTRAINT [FK_Order_Client]
GO


