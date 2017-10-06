properties(
    [
        pipelineTriggers([cron('H 3 * * *')]),
    ]
)
    
pipeline {
    agent any
    options {
        disableConcurrentBuilds()  //each branch has 1 job running at a time
    }
    stages {
        stage('Build') {
            steps {
                sh "chmod +x $WORKSPACE/conf/scripts/install.sh"
                sh "$WORKSPACE/conf/scripts/install.sh"
            }
        }
        stage('Test and calculate coverage') {
            steps {
                retry(3) {
                    sh "chmod +x $WORKSPACE/conf/scripts/calculate_coverage.sh"
                    sh "$WORKSPACE/conf/scripts/calculate_coverage.sh JENKINSTESTSdendroVagrantDemo root r00t_p4ssw0rd"
                }
            }
        }
        stage('Report coverage') {
            steps {
                sh "chmod +x $WORKSPACE/conf/scripts/report_coverage.sh"
                sh "$WORKSPACE/conf/scripts/report_coverage.sh"
            }
        }
        stage('Deploy') {
            steps {
                echo 'No deployments yet. Skipping.'
                //sh "chmod +x $WORKSPACE/conf/scripts/deploy.sh"
            }
        }
        stage('Cleanup') {
            steps {
                echo "Cleaning workspace at $WORKSPACE"
                sh "rm -rf $WORKSPACE/*"
            }
        }
    }
    post
    {
        failure {
            echo "Cleaning workspace at $WORKSPACE"
            sh "rm -rf $WORKSPACE/*"
        }
    }
}
