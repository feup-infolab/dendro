if (!require(pacman)) {
  install.packages("pacman")
  library(pacman)
}

pacman::p_load(magrittr, dplyr, tidyr, ggplot2, gdata, reshape2, forcats, plyr)

library(readr)

getDataSeries <- function (sourceFile, num_instances)
{
  data <- read_csv(sourceFile, trim_ws = TRUE)
  data$cpu_total <- data$total_cpu_usage_usr + data$total_cpu_usage_sys
  data[,"num_instances"] <- num_instances
  return(data)
}

saveToPDF <- function(plot, pdfFile)
{
  ggsave(pdfFile,plot, width=30, height=15, units="cm", scale=1)
}

instances_factor <- factor(c(1,2,4,8,12,24));
instances_labels <- c(
    `1` = "1 Instance", 
    `2` = "2 Instances",
    `4` = "4 Instances",
    `8` = "8 Instances", 
    `12` = "12 Instances", 
    `24` = "24 Instances"
  )

instances_labeller <- function(variable,value){
  return(instances_labels[value])
}

dstat_threads1 <- getDataSeries("./dados/dstat_no_timeouts/dstat_1_thread.csv", "1")
dstat_threads2 <- getDataSeries("./dados/dstat_no_timeouts/dstat_2_thread.csv", "2")
dstat_threads4 <- getDataSeries("./dados/dstat_no_timeouts/dstat_4_thread.csv", "4")
dstat_threads8 <- getDataSeries("./dados/dstat_no_timeouts/dstat_8_thread.csv", "8")
dstat_threads12 <- getDataSeries("./dados/dstat_no_timeouts/dstat_12_thread.csv", "12")
dstat_threads24 <- getDataSeries("./dados/dstat_no_timeouts/dstat_24_thread.csv", "24")

all_data <- rbind.fill(dstat_threads1, dstat_threads2, dstat_threads4, dstat_threads8, dstat_threads12, dstat_threads24)
all_data$mem_used <- all_data$mem_used / 10^9
all_data$disk_writ <- all_data$disk_writ / 10^6
all_data$disk_read <- all_data$disk_read / 10^6


# Calculate build times
build_times <- data.frame(
  Instances = instances_factor,
  Build_time = c(
      dstat_threads1$Second[length(dstat_threads1$Second)],
      dstat_threads2$Second[length(dstat_threads2$Second)],
      dstat_threads4$Second[length(dstat_threads4$Second)],
      dstat_threads8$Second[length(dstat_threads8$Second)],
      dstat_threads12$Second[length(dstat_threads12$Second)],
      dstat_threads24$Second[length(dstat_threads24$Second)]
    ),
    Percent = c(
      '',
      paste("-",round(100-dstat_threads2$Second[length(dstat_threads2$Second)] / dstat_threads1$Second[length(dstat_threads1$Second)]*100, digits = 2), "%", sep=''),
      paste("-",round(100-dstat_threads4$Second[length(dstat_threads4$Second)] / dstat_threads1$Second[length(dstat_threads2$Second)]*100, digits = 2), "%", sep=''),
      paste("-",round(100-dstat_threads8$Second[length(dstat_threads8$Second)] / dstat_threads1$Second[length(dstat_threads4$Second)]*100, digits = 2), "%", sep=''),
      paste("-",round(100-dstat_threads12$Second[length(dstat_threads12$Second)] / dstat_threads1$Second[length(dstat_threads8$Second)]*100, digits = 2), "%", sep=''),
      paste("-",round(100-dstat_threads24$Second[length(dstat_threads24$Second)] / dstat_threads1$Second[length(dstat_threads12$Second)]*100, digits = 2), "%", sep='')
    )
  )

  

# Plot build time
build_time_vs_instances<-
  ggplot(data=build_times, aes(x=Instances, y=Build_time, fill=Instances)) +
  geom_bar(stat="identity") + 
  geom_text(aes(x=Instances, y=Build_time, label=Percent, vjust=3.5), position = position_dodge(width=0.9)) +
  theme(legend.position = "none") +
  xlab("Number of instances") + 
  ylab("Build time (seconds)")

print(build_time_vs_instances)

saveToPDF(build_time_vs_instances, "./charts/build_time_vs_instances.pdf")

# Plot chart

plotFacetedChart <- function (all_data, chartParameters)
{
  column <-  chartParameters[[1]]
  xlabel <- chartParameters[2]
  ylabel <- chartParameters[3]
  all_data$num_instances_f <- factor(all_data$num_instances, levels = instances_factor)
  
  chart <- ggplot(data = all_data, aes_string(x = "Second", y = column)) + 
    geom_line(size=0.5) + 
    facet_wrap(~num_instances_f, labeller = as_labeller(instances_labels)) + 
    xlab(xlabel) + 
    ylab(ylabel) + 
    geom_smooth(method="lm")
  
  saveToPDF(chart, paste("./charts/",column,".pdf", sep =''))
}

charts <- list(
  c("cpu_total", "Build time (seconds)", "CPU Usage, All Cores (%)"),
  c("disk_writ", "Build time (seconds)", "Disk I/O Write (MB/s)"),
  c("disk_read", "Build time (seconds)", "Disk I/O Read (MB/s)"),
  c("mem_used", "Build time (seconds)", "Used Memory (GB)")
)


for (i in charts) { 
  plotFacetedChart(all_data, i)
}




