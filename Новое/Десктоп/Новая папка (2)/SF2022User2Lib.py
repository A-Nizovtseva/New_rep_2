import datetime

class Calculations():
    def __init__(self, start_times, durations, begin_working_time, end_working_time, consultation_time):
        self.start_times = start_times
        self.durations = durations
        self.begin_working_time = begin_working_time
        self.end_working_time = end_working_time
        self.consultation_time = consultation_time

    def available_periods(self):

        def str_to_time(time_str):
            hours = int(time_str [0:2])
            minutes = int(time_str [3:5])
            return datetime.timedelta(hours= hours , minutes=minutes)

        result = []
        begin_free_time = str_to_time(begin_working_time)
        free_duration = str_to_time('00:30')
        for count in range(20):
            end_free_time = begin_free_time + free_duration
            busy_flag = 0
            for count_start_times in range(len(start_times)):
                begin_work_time = str_to_time(start_times[count_start_times])
                end_work_time = str_to_time(start_times[count_start_times])+\
                                str_to_time( '0'+str( int(durations[count_start_times]/60) )+':'+\
                                             str( durations[count_start_times]%60 ) )

                if ( (begin_work_time >= begin_free_time) and (begin_work_time < end_free_time) ) or\
                   ( (end_work_time >= begin_free_time) and (end_work_time < end_free_time) ):
                    busy_flag =1
                    pass

            if busy_flag == 0:
                result.append(str(begin_free_time) +' - '+ str(end_free_time) )
            begin_free_time = end_free_time
        return result

        
##start_times = ['10:00', '11:00', '15:00', '15:30', '16:50']
##durations = [60, 30, 10 , 10, 40]
##begin_working_time = '08:00'
##end_working_time = '18:00'
##consultation_time = 30

calculation = Calculations(start_times, durations, begin_working_time, end_working_time, consultation_time)
res = calculation.available_periods()

